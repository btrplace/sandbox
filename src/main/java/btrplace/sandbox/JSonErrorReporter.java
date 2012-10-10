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

import btrpsl.ErrorMessage;
import btrpsl.ErrorReporter;
import org.codehaus.jettison.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * JSon output for error messages.
 * @author Fabien Hermenier
 */
public class JSonErrorReporter extends JSONObject implements ErrorReporter {

    private List<ErrorMessage> msgs;

    public JSonErrorReporter() {
        msgs = new ArrayList<ErrorMessage>();
    }

    @Override
    public void append(int lineNo, int colNo, String msg) {
        msgs.add(new ErrorMessage(lineNo, colNo, msg));
    }

    @Override
    public List<ErrorMessage> getErrors() {
        return msgs;
    }

    @Override
    public void updateNamespace() {

    }

    @Override
    public String toString() {
        StringBuilder b = new StringBuilder();
        b.append('[');
        for (Iterator<ErrorMessage> ite = msgs.iterator(); ite.hasNext(); ) {
            ErrorMessage err = ite.next();
            b.append('{');
            b.append("\"lineNo\":").append(err.lineNo).append(',');
            b.append("\"colNo\":").append(err.colNo).append(',');
            b.append("\"msg\":").append('"').append(err.message).append('"');
            b.append('}');
            if (ite.hasNext()) {
                b.append(',');
            }
        }
        b.append(']');
        return b.toString();
    }
}
