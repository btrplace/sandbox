/*
 * Copyright (c) 2014 University of Nice Sophia-Antipolis
 *
 * This file is part of btrplace-sandbox.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package btrplace.sandbox;


import btrplace.btrpsl.*;
import btrplace.json.JSONConverterException;
import btrplace.json.plan.ReconfigurationPlanConverter;
import btrplace.model.*;
import btrplace.model.constraint.SatConstraint;
import btrplace.model.view.ShareableResource;
import btrplace.plan.ReconfigurationPlan;
import btrplace.plan.event.MigrateVM;
import btrplace.solver.SolverException;
import btrplace.solver.choco.ChocoReconfigurationAlgorithm;
import btrplace.solver.choco.DefaultChocoReconfigurationAlgorithm;
import btrplace.solver.choco.durationEvaluator.LinearToAResourceActionDuration;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import net.minidev.json.JSONValue;

import javax.servlet.ServletContext;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.*;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

/**
 * Simili Resource to check then solve non-viable configurations.
 *
 * @author Fabien Hermenier
 */
@Path("{path}")
public class BtrPlace {
	
	private JSONArray lastConfig = null;
	private String lastScript = null;
	private JSONObject lastPlan = null;

    public BtrPlace(@Context ServletContext context) {
		lastConfig = (JSONArray) context.getAttribute("lastConfig");
		lastScript = (String) context.getAttribute("lastScript");
		lastPlan = (JSONObject) context.getAttribute("lastPlan");
    }

	/**
	 * Prepends an initial script with more data to get it valid as a BtrpSL script.
	 * This allows the client-side script to be more lightweight and easier to read.
	 * @param model The model concerned about the script.
	 * @param constraints The client constraints script.
	 * @return The completed and valid script.
	 */
    private String complete(Model model, String constraints) {
		StringBuilder n = new StringBuilder();

		NamingService namingService = (NamingService) model.getView("btrpsl.ns");
        n.append("namespace sandbox;\n");
		
		for(Node node : model.getMapping().getAllNodes()){
			String nodeRealID = namingService.resolve(node);
			constraints = constraints.replaceAll(nodeRealID.substring(1), nodeRealID);
		}

		n.append('\n');

		n.append(constraints).append("\n");

        return n.toString();
    }


	/**
	 * Look for a solution for a given configuration and a given constraints script.
	 * Issue a Response to client.
	 * @param cfg The client's configuration (Nodes,VMs)
	 * @param scriptInput Constraints script input from client.
	 * @return The server computed solution.
	 */
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response check(@Context ServletContext context, @PathParam("path") String path, @FormParam("cfg") String cfg, @FormParam("script") String scriptInput) {
		if (! path.equals("inspect")) return null;

		Model model = new DefaultModel();

        // Create the resources
		ShareableResource rcCPU = new ShareableResource("cpu", 8, 0);
		ShareableResource rcMem = new ShareableResource("mem", 7, 0);

		// Get the mapping
		Mapping mapping = model.getMapping();

        ScriptBuilder scriptBuilder = new ScriptBuilder(model);
        NamingService ns = scriptBuilder.getNamingService();
		// Load the nodes

		JSONArray config = (JSONArray) JSONValue.parse(cfg);
		for(Object nodeObject : config){
			JSONObject node = (JSONObject) nodeObject;
			// Get the ID number (without 'N') of the Node
            Node n = model.newNode();
            try {
                ns.register("@"+node.get("id"), n);
            } catch (NamingServiceException e) {
                e.printStackTrace();
            }

			// Setting capacities
			// Node CPU
			int cpu = (Integer) node.get("cpu");
			rcCPU.setCapacity(n, cpu);
			// Node Mem
			int mem = (Integer) node.get("mem");
			rcMem.setCapacity(n, mem);

			// Add the node to the map
			boolean online = (Boolean) node.get("online");
			if( online ) mapping.addOnlineNode(n);
			else mapping.addOfflineNode(n);

			// Add the VMs of the node
			JSONArray vmsIDs = (JSONArray) node.get("vms");
			for(Object vmObject : vmsIDs){
				JSONObject vm = (JSONObject) vmObject;

				// Create the VM object
				VM v = model.newVM();
				// Register the VM
			    try {
					ns.register("sandbox."+vm.get("id"), v);
				} catch (NamingServiceException e) {
					e.printStackTrace();
				}

				// Consumptions
				// CPU
				int VMCpu = (Integer) vm.get("cpu");
				rcCPU.setConsumption(v, VMCpu);
				// Mem
				int VMMem = (Integer) vm.get("mem");
				rcMem.setConsumption(v, VMMem);

				// Add the VM to the map
				mapping.addRunningVM(v, n);
			}
		}

		// Store the last config
		lastConfig = config;
		context.setAttribute("lastConfig", lastConfig);

		// Attach the views
  		model.attach(rcCPU);
		model.attach(rcMem);

		//System.out.println("Model built successfully");

		// Preparing the response
		JSONObject response = new JSONObject();
		response.put("errors",null);
		response.put("solution",null);

		// Fixing the script to match BtrpSL requirements
		int initialLength = scriptInput.split("\n").length;
		scriptInput = complete(model, scriptInput);
		// Number of lines added by the 'complete' method
		int addedLinesNum = scriptInput.split("\n").length-initialLength;

		// Store the last script
		lastScript = new String(scriptInput);
		context.setAttribute("lastScript", lastScript);

		Script script ;
		try {
			script = scriptBuilder.build(scriptInput);
            //Ignore continuous constraints
            for (SatConstraint cstr : script.getConstraints()) {
                cstr.setContinuous(false);
            }
		} catch (ScriptBuilderException sbe){
			List<ErrorMessage> errorsList = sbe.getErrorReporter().getErrors();
			List<JSONObject> errors = new ArrayList<JSONObject>();

			for(ErrorMessage error : errorsList){
				JSONObject e = new JSONObject();
				e.put("row",error.lineNo() - addedLinesNum);
				e.put("column",error.colNo());
				e.put("message",error.message());
				errors.add(e);
			}

			response.put("errors",errors);
			return Response.ok(response).build();
		}
        List<SatConstraint> constraints = new ArrayList(script.getConstraints());

        ArrayList<Integer> unsatisfiedConstrains = new ArrayList<Integer>();
        Integer currentConstrain = 0 ;
        for(SatConstraint c : constraints){
            if(!c.isSatisfied(model)){
                unsatisfiedConstrains.add(currentConstrain);
            }
            currentConstrain++;
        }

        ChocoReconfigurationAlgorithm ra = new DefaultChocoReconfigurationAlgorithm();

		//System.out.println("Going to solve problem with: " + model.getVMs().size() + " VMS, " + model.getNodes().size() + " nodes");

		//model.detach(namingService);

		ra.getDurationEvaluators().register(MigrateVM.class, new LinearToAResourceActionDuration("mem", 0.5));

        try {
            //System.out.println(model);
            //System.out.println("constraints: " + constraints);
            ReconfigurationPlan plan = ra.solve(model, constraints);
            //System.out.println("Resulting plan:\n" + plan);
            if (plan == null) {
                System.err.println("[ERROR] No solution to the plan");
                return Response.ok(response).build();
            }
            ReconfigurationPlanConverter planConverter = new ReconfigurationPlanConverter();
            planConverter.getModelConverter().getViewsConverter().register(new InMemoryNamingServiceConverter());
            VM [] vms = model.getMapping().getAllVMs().toArray(new VM[model.getMapping().getAllVMs().size()]);
            try {
                JSONObject responseSolution = planConverter.toJSON(plan);
				JSONArray actionsJSON = (JSONArray) responseSolution.get("actions");
				for(Object actionObject : actionsJSON){
					JSONObject actionJSON = (JSONObject) actionObject;
					if( actionJSON.keySet().contains("vm") ){
						// Converting the BtrPlace ID of the VM to the BtrpSL ID.
                        int btrplaceID =Integer.parseInt(actionJSON.get("vm").toString());
                        for (VM v : vms) {
                            if (v.id() == btrplaceID) {
                                String slId = ns.resolve(v);
                                slId = slId.substring(slId.lastIndexOf(".") + 1);
                                int btrpSLID = Integer.parseInt(slId.substring(2));
                                actionJSON.put("vm", btrpSLID);
                                break;
                            }
                        }
					}
				}
				response.put("actions",actionsJSON);

				// Store the last plan
				lastPlan = new JSONObject(response);
				context.setAttribute("lastPlan", lastPlan);

                return Response.ok(response).build();
            } catch (JSONConverterException e) {
				System.err.println("[ERROR] Could not convert Plan to JSON.");
                e.printStackTrace();
				return Response.ok(response).build();
            }
        } catch (SolverException ex) {
			System.err.println("[ERROR] Could not find a solution.");
			ex.printStackTrace();
			return Response.ok(response).build();
        } catch (Exception ex){
			System.err.println("[ERROR] Unknown error.");
			ex.printStackTrace();
			return Response.ok(response).build();
		}
		//return Response.serverError().build();
    }

	@GET
	@Produces("text/plain")
	public String export(@PathParam("path") String path, @QueryParam("dir") String directory) {
		if (! path.equals("export")) return "NOT IMPLEMENTED";

		if (lastConfig != null && lastScript != null && lastPlan != null ) {

			String exportPath = "export/" + directory.replaceAll("\\W+", "_");

			// Create dir
			try {
				Files.createDirectory(Paths.get(exportPath));
			} catch (IOException e) {
	            e.printStackTrace();
	            return "ERROR: Already exist !";
			}

			// Create files
			try {
				FileWriter fileConfig = new FileWriter(exportPath + "/config.json");
				FileWriter fileScript = new FileWriter(exportPath + "/script.btrp");
				FileWriter filePlan = new FileWriter(exportPath + "/plan.json");

				// Write
				fileConfig.write(lastConfig.toJSONString());
				fileScript.write(lastScript);
				filePlan.write(lastPlan.toJSONString());

				// Flush
				fileConfig.flush();
				fileScript.flush();
				filePlan.flush();

				// Close
				fileConfig.close();
				fileScript.close();
				filePlan.close();

			} catch (IOException e) {
	            e.printStackTrace();
	            return "ERROR: Write failed !";
			}
			return "Done !";
		}
		return "ERROR: No valid plan !";
	}
}
