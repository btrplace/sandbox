/*
 * Copyright (c) 2012 University of Nice Sophia-Antipolis
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

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

/**
 * A Cache for experiments.
 * @author Fabien Hermenier
 */
@Path("/pin")
public class Cache {

    private static final String CACHE_DIR = "cache";

    private static final String EXT = ".js";

    /**
     * Encache a sandbox.
     * @param req
     * @param context
     * @param scenario the sandbox to encache
     * @return
     */
    @POST
    public Response push(@Context HttpServletRequest req, @Context ServletContext context, @FormParam("experiment") String scenario) {

        //Extract the JSON stuff, store into a JS file
        String id = makeID(context);
        PrintWriter out = null;
        try {
            out = new PrintWriter(new FileWriter(context.getRealPath(CACHE_DIR) + File.separator + id));
            out.println(scenario);
            //Remove the /rest/cache stuff
            String rest = req.getRequestURL().substring(0,req.getRequestURL().lastIndexOf("/"));
            String root = rest.substring(0, rest.lastIndexOf("/") + 1);
            String uri = root + "?id=" + id;
            return Response.created(new URI(uri)).build();
        } catch(Exception e) {
            e.printStackTrace();
            return Response.serverError().build();
        } finally {
            if (out != null) {
                out.close();
            }
        }
    }

    /**
     * Delete a sandbox
     * @param context
     * @param id the sandbox identifier
     * @return code 200 if the operation is successful, code 304 if the sandbox does not exist or was not deleted.
     */
    @DELETE
    public Response delete(@Context ServletContext context, @QueryParam("id") String id) {
        String path = context.getRealPath(CACHE_DIR) + File.separator + id;
        File f = new File(path);
        if (!f.exists()) {
            return Response.notModified().build();
        } else {
            if (!f.delete()) {
                return Response.notModified().build();
            }
        }
        return Response.ok().build();
    }

    /**
     * List all the pinned sandboxes.
     * @param context
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response list(@Context ServletContext context) {
        File root = new File(context.getRealPath(CACHE_DIR));
        JSONObject o = new JSONObject();
        List<String> ids = new ArrayList<String>();
        if (root.exists() && root.list() != null) {
            for(String id : root.list()) {
                ids.add(id);
            }
        }
        try {
            o.put("ids", ids);
            return Response.ok(o.toString()).build();
        } catch (JSONException e) {
            System.err.println(e.getMessage());
            return Response.serverError().build();
        }
    }

    private String makeID(ServletContext ctx) {

        String cachePath = ctx.getRealPath(CACHE_DIR);
        File d = new File(cachePath);
        if (!d.isDirectory()) {
            if (!d.mkdirs()) {
                System.err.println("Unable to create the cache directory '" + d.getPath() + "'");
            }
        }

        long l = System.currentTimeMillis();
        String path = ctx.getRealPath(CACHE_DIR + File.separator + l + EXT);
        File f = new File(path);
        while (f.exists()) {
            f = new File(makeID(ctx));
        }
        return l + EXT;
    }
}
