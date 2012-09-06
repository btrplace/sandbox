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
        List<Action> longActions = new ArrayList<Action>();
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
