/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagIterator;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStream;

import java.io.IOException;
import java.util.List;
import java.util.Queue;

public class CompositeStream<T extends TagStream> extends OpenSafelyTagStream
{
	/** */
	protected TagMap tagMap;
	/** */
	protected TagMap customTagMap;

	/** sub {@link TagStream} list */
	protected List<T> subStreams;
	/** queuing tools for works */
	protected Queue<T> workQueue;
	/** */
	protected T workStream;

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		// arrange tag mapper
		if ( this.customTagMap == null ) this.tagMap = tagMap;
		else
		{
			this.tagMap = this.customTagMap;
			this.tagMap.link(tagMap);
			this.tagMap.iterator().reset();
		}

		// queueing works firstly.
		iterateWork(true);

		return true;
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
		// If there is a working inlet, close it
		if ( this.workStream != null )
		{
			this.workStream.close(tagMap);
			this.workStream = null;
		}
	}

	@Override
	public boolean hasRemaining()
	{
		return this.workQueue.size() > 0 || (this.workStream != null && this.workStream.hasRemaining());
	}

	/**
	 * set Custom {@link TagMap}
	 * @param customMap
	 */
	public void customizeTagMap(TagMap customMap)
	{
		this.customTagMap = customMap;
	}


	/**
	 * if there is a need of reworking, You have to override this function to do someghint and return true.
	 * @return
	 */
	protected void iterateWork(boolean isFirst)
	{
		TagIterator it = this.tagMap.iterator();

		if ( it != null )
		{
			if ( it.moveNext() ) this.workQueue.addAll(this.subStreams);
			// else then empty... no works
		}
		else if ( isFirst )
		{
			this.workQueue.addAll(this.subStreams);
		}
	}

	/**
	 * Get next {@link TagStream} from {@link #workQueue} and set it to {@link #workStream} and open it
	 * @return
	 */
	protected T openWorkStream() throws IOException
	{
		while ( this.workStream == null && this.workQueue.size() > 0 )
		{
			this.workStream = this.workQueue.poll();
			this.workStream.open(this.tagMap);

			if ( this.workStream.hasRemaining() == false )
			{
				// skip no-op stream
				this.workStream = null;
			}
		}

		return this.workStream;
	}

	/**
	 * close {@link #workStream}
	 */
	protected void closeWorkStream()
	{
		if ( this.workStream != null )
		{
			this.workStream.close(this.tagMap);
			this.workStream = null;
		}
	}


	// GETTER/SETTER mehods ======================
	public List<T> getSubStreams() { return subStreams; }
}
