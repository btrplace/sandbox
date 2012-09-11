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

/**
 *
 * @author Fabien Hermenier
 */
@Path("/pin")
public class Cache {

    private static final String CACHE_DIR = "cache";

    private static final String EXT = ".js";

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

    @DELETE
    public void delete(@QueryParam("id") String id) {

    }

    private String makeID(ServletContext ctx) {

        String cachePath = ctx.getRealPath(CACHE_DIR);
        File d = new File(cachePath);
        if (!d.isDirectory()) {
            if (!d.mkdirs()) {
                System.err.println("Unable to create the cache directory '" + d.getPath() + "'");
            } else {
                System.err.println("Cache '" + d.getPath() + "' created");
            }
        } else {
            System.err.println("Reusing '" + d.getPath() + "'");
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
