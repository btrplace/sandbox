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
