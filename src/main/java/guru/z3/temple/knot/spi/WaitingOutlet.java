/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.ByteBufferHelper;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamOutlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Queue;

/**
 * This controls lazy out of streams, because there is not-resolved outlet.
 *
 * <p>
 *     System.property : tagstream.waiting.buf.size
 *     <br/>
 *     This property's value is size of buffer to store bytes of forward outlets
 * </p>
 */
public class WaitingOutlet implements TagStreamOutlet
{
	private TagStreamOutlet pendedOutlet;
	private ByteBuffer forwardBuf;
	private boolean resolved;

	private TagMap tagMap;
	private WaitingOutlet recursiveWaiting;

	public WaitingOutlet(TagStreamOutlet pendedOutlet)
	{
		this.pendedOutlet = pendedOutlet;
		int maxForwardBufSize = Integer.parseInt(System.getProperty("tagstream.waiting.buf.size", "2048"));
		this.forwardBuf = ByteBuffer.allocate(maxForwardBufSize);
	}

	public WaitingOutlet(TagStreamOutlet pendedOutlet, int maxForwardBufSize)
	{
		this.pendedOutlet = pendedOutlet;
		this.forwardBuf = ByteBuffer.allocate(maxForwardBufSize);
	}

	@Override
	public boolean open(TagMap tagMap) throws RuntimeException
	{
		this.tagMap = tagMap;
		return true;
	}

	@Override
	public void close(TagMap tagMap) throws RuntimeException
	{
		this.tagMap = null;
	}

	@Override
	public boolean isOpened()
	{
		return this.tagMap != null;
	}

	public int get(ByteBuffer buf) throws RuntimeException
	{
		try
		{
			if ( !this.resolved ) throw new RuntimeException("Not resolved");

			int count = 0;
			if ( this.pendedOutlet.hasRemaining() )
			{
				count += this.pendedOutlet.get(buf);
				if ( !this.pendedOutlet.hasRemaining() ) this.pendedOutlet.close(this.tagMap);
			}

			if ( !this.pendedOutlet.hasRemaining() && this.forwardBuf.hasRemaining() )
			{
				count += ByteBufferHelper.copy(this.forwardBuf, buf);
			}

			return count;
		}
		catch(IOException e)
		{
			throw new RuntimeException(e.getMessage(), e);
		}
	}

	public boolean hasRemaining()
	{
		return this.resolved && (this.pendedOutlet.hasRemaining() || this.forwardBuf.hasRemaining());
	}

	public void setPendedTool(TagStreamOutlet pendedOutlet)
	{
		this.pendedOutlet = pendedOutlet;
		this.resolved = false;
	}

	public boolean resolve(Queue<TagStreamOutlet> outletQueue) throws IOException
	{
		if ( this.resolved ) return true;

		while ( outletQueue.size() > 0 )
		{
			TagStreamOutlet outlet = outletQueue.poll();
			if ( !outlet.open(this.tagMap) )
			{
				WaitingOutlet waiting = new WaitingOutlet(outlet, 2048);
				waiting.open(this.tagMap);

				if ( !waiting.resolve(outletQueue) ) return false;

				outlet = waiting;
			}

			outlet.get(this.forwardBuf);
			if ( outlet.hasRemaining() ) throw new IOException("Not resolved, need more buffer");
			outlet.close(this.tagMap);

			// check pended outlet has been resolved.
			this.resolved = this.pendedOutlet.open(tagMap);

			if ( this.resolved )
			{
				this.forwardBuf.flip();
				return true;
			}
		}

		return false;
	}

	// GETTER/SETTER methods =====================
	public TagStreamOutlet getPendedOutlet() { return pendedOutlet; }
}
