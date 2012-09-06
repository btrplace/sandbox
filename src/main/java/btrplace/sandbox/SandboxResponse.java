package btrplace.sandbox;

import entropy.plan.TimedReconfigurationPlan;
import entropy.plan.action.Action;
import entropy.plan.action.ActionComparator;
import entropy.plan.action.Migration;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: fhermeni
 * Date: 31/08/12
 * Time: 23:58
 * To change this template use File | Settings | File Templates.
 */
public class SandboxResponse {

    private List<Integer> violated;

    private List<ShortAction> actions;

    private static ActionComparator cmp = new ActionComparator(ActionComparator.Type.start);
    public SandboxResponse(List<Integer> violated, TimedReconfigurationPlan plan) {
        this.violated = violated;
        List <Action> longActions = new ArrayList<Action>();
        for (Action a : plan.getActions()) {
            longActions.add(a);
        }
        Collections.sort(longActions, cmp);

        actions = new ArrayList<ShortAction>();
        for (Action a : longActions) {
            actions.add(reduce(a));
        }
    }

    private ShortAction reduce(Action a) {
        if (a instanceof Migration)
            return new ShortAction((Migration) a);
        throw new UnsupportedOperationException();
    }

}
