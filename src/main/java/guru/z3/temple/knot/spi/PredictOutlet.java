/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagStreamOutlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

public class PredictOutlet extends PredictStream<TagStreamOutlet> implements TagStreamOutlet
{
	final public static TagStreamOutlet.Factory Factory = (metadata) ->
	{
		Map<String,TagStreamOutlet> subOutlets = new HashMap<>();
		if ( metadata.getSubMetadata() != null )
		{
			metadata.getSubMetadata().forEach(m -> subOutlets.put(m.getName(), m.createTagStreamOutlet(TagStreamOutlet.class)));
		}

		PredictOutlet instance = new PredictOutlet();
		instance.name = metadata.getName();
		instance.subMap = subOutlets;
		instance.predictFunction = metadata.getParamMap().get("predict.func", Function.class);

		return instance;
	};

	@Override
	public int get(ByteBuffer buf) throws IOException
	{
		if ( this.workStream == null ) throw new IOException("There is no predicted stream");
		return this.workStream.get(buf);
	}
}
