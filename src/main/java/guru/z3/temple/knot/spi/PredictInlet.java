/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagStreamInlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

public class PredictInlet extends PredictStream<TagStreamInlet> implements TagStreamInlet
{
	final public static TagStreamInlet.Factory Factory = (metadata) ->
	{
		Map<String,TagStreamInlet> subInlets = new HashMap<>();
		if ( metadata.getSubMetadata() != null )
		{
			metadata.getSubMetadata().forEach(m -> subInlets.put(m.getName(), m.createTagStreamInlet()));
		}

		PredictInlet inlet = new PredictInlet();
		inlet.subMap = subInlets;
		inlet.predictFunction = metadata.getParamMap().get("predict.func", Function.class);

		return inlet;
	};

	@Override
	public int put(ByteBuffer buf) throws IOException
	{
		if ( this.workStream == null ) throw new IOException("There is no predicted stream");
		return this.workStream.put(buf);
	}
}
