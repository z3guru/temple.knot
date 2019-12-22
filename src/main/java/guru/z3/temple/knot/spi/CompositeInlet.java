/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamInlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.LinkedList;
import java.util.List;

/**
 * This has a list of {@link TagStreamInlet}
 */
public class CompositeInlet extends CompositeStream<TagStreamInlet>  implements TagStreamInlet
{
	final public static TagStreamInlet.Factory Factory = (metadata) ->
	{
		List<TagStreamInlet> subs = new LinkedList();
		if ( metadata.getSubMetadata() != null )
		{
			metadata.getSubMetadata().forEach(m -> subs.add(m.createTagStreamInlet()));
		}

		CompositeInlet instance = new CompositeInlet(subs);
		instance.customTagMap = metadata.getParamMap().get("composite.custom.tagservice", TagMap.class);

		return instance;
	};

	public CompositeInlet()
	{
		this(new LinkedList<TagStreamInlet>());
	}

	public CompositeInlet(List<TagStreamInlet> subInlets)
	{
		this.subStreams = subInlets;
		this.workQueue = new LinkedList();
	}

	@Override
	public int put(ByteBuffer buf) throws IOException
	{
		int count = 0;
		TagStreamInlet inlet = openWorkStream();

		while ( inlet != null && buf.hasRemaining() )
		{
			count += inlet.put(buf);

			// remove tool from queue, when the tool don't need more data
			if ( !inlet.hasRemaining() )
			{
				// closing inlet has been done.
				closeWorkStream();
				// check remains need data really, because some inlet needs no data.
				// If there are inlets need no data in remains, those are removed from workQueue.
				inlet = openWorkStream();
				if ( inlet == null )
				{
					// check reworking ...
					iterateWork(false);
					// if reworking ...
					if (
							this.workQueue.size() > 0
							&& buf.hasRemaining() // there is no more data... forever...
					) inlet = openWorkStream();
				}
			}
		}

		return count;
	}
}
