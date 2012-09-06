package btrplace.sandbox;

import entropy.plan.action.Migration;

/**
 * Created with IntelliJ IDEA.
 * User: fhermeni
 * Date: 31/08/12
 * Time: 23:59
 * To change this template use File | Settings | File Templates.
 */
public class ShortAction {

    private int start;

    private String type;

    private String id;

    private String from;

    private String to;

    public ShortAction(Migration m) {
        start = m.getStartMoment();
        type = "M";
        id = m.getVirtualMachine().getName();
        from = m.getHost().getName();
        to = m.getDestination().getName();
    }
}
