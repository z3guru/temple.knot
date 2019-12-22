/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamOutlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.LinkedList;
import java.util.List;

/**
 * This has a list of {@link TagStreamOutlet}
 */
public class CompositeOutlet extends CompositeStream<TagStreamOutlet> implements TagStreamOutlet
{
	final public static TagStreamOutlet.Factory Factory = (metadata) ->
	{
		List<TagStreamOutlet> subs = new LinkedList();
		if ( metadata.getSubMetadata() != null )
		{
			metadata.getSubMetadata().forEach(m -> subs.add(m.createTagStreamOutlet(TagStreamOutlet.class)));
		}

		CompositeOutlet instance = new CompositeOutlet(subs);
		instance.name = metadata.getName();
		instance.customTagMap = metadata.getParamMap().get("composite.custom.tagservice", TagMap.class);

		return instance;
	};

	public CompositeOutlet()
	{
		this(new LinkedList<TagStreamOutlet>());
	}

	public CompositeOutlet(List<TagStreamOutlet> subOutlets)
	{
		this.subStreams = subOutlets;
		this.workQueue = new LinkedList();
	}

	@Override
	public int get(ByteBuffer buf) throws IOException
	{
		int count = 0;

		while ( buf.hasRemaining() && this.workQueue.size() > 0 )
		{
			TagStreamOutlet outlet = openWorkStream();
			count += outlet.get(buf);

			// remove tool from queue, when the tool don't need more data
			if ( !outlet.hasRemaining() )
			{
				// closing inlet has been done.
				closeWorkStream();

				// if there are tools in queue, check re-work()
				if ( this.workQueue.size() == 0 ) iterateWork(false);
				// No rework
				if ( this.workQueue.size() == 0 ) break;
			}
		}

		return count;
	}

	@Override
	protected TagStreamOutlet openWorkStream() throws IOException
	{
		if ( this.workStream == null && this.workQueue.size() > 0 )
		{
			this.workStream = this.workQueue.poll();
			if ( !this.workStream.open(this.tagMap) )
			{
				// lazy working, so wait that the work is complete ...
				WaitingOutlet waitingOutlet = new WaitingOutlet(this.workStream);
				waitingOutlet.open(this.tagMap);

				if ( waitingOutlet.resolve(this.workQueue) )
				{
					// All is resolved ...
					this.workStream = waitingOutlet;
					return waitingOutlet;
				}
				else
				{
					String name = null;
					if ( OpenSafelyTagStream.class.isAssignableFrom(waitingOutlet.getPendedOutlet().getClass()) )
					{
						name = ((OpenSafelyTagStream)waitingOutlet.getPendedOutlet()).getName();
					}

					throw new IOException("Outlet can't be resolved:outlet=" + name);   // TODO logging for pending item.
				}
			}
		}

		return this.workStream;
	}
}
