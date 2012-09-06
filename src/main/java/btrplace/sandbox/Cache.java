package btrplace.sandbox;

import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Created with IntelliJ IDEA.
 * User: fhermeni
 * Date: 30/08/12
 * Time: 13:29
 * To change this template use File | Settings | File Templates.
 */
@Path("/cache")
public class Cache {

    @POST
    public Response push(@QueryParam("cfg") String config, @QueryParam("script") String constraints) {
        String key = Long.toString(System.currentTimeMillis());

        System.out.println("Configuration: " + config);
        System.out.println("Script: " + constraints);


        try {
            return Response.created(new URI("sandbox/gallery?tag="+key)).build();
        } catch (URISyntaxException e) {
            return Response.ok("sandbox/gallery?tag="+key).build();
        }
    }

    @GET
    @Produces("text/plain")
    public String load(@QueryParam("tag") String tag) {
        if (tag == null) {
            return "no Element";
        } else {
            return "redirect to the reference '" + tag + "'";
        }
    }
}
