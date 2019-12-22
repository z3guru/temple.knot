/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.*;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.function.Function;

public class ChunkByLengthInlet extends ChunkByLengthStream<TagStreamInlet> implements TagStreamInlet
{
	/** */
	private boolean notChunked;

	final public static TagStreamInlet.Factory Factory = (metadata) ->
	{
		TagStreamInlet sub = null;
		if ( metadata.getSubMetadata() != null )
		{
			TagStreamMetadata subMeta = metadata.getSubMetadata().get(0);
			sub = subMeta.createTagStreamInlet();
		}

		int chunksSize = metadata.getParamMap().get("chunk.buf.size", Integer.class);
		String lengthTagName = metadata.getParamMap().get("chunk.buf.tagname", String.class);

		ChunkByLengthInlet instance = new ChunkByLengthInlet(sub, chunksSize, lengthTagName);
		instance.setLengthChangeFunction(metadata.getParamMap().get("chunk.length.func.inlet", Function.class));

		return instance;
	};

	public ChunkByLengthInlet(TagStreamInlet subStream, int maxChunkSize, String lengthTagName)
	{
		this.subStream = subStream;
		this.chunkBuf = ByteBuffer.allocate(maxChunkSize);
		this.lengthTag = Tag.newKey(lengthTagName, Integer.class);
	}

	public ChunkByLengthInlet(TagStreamInlet subStream, int maxChunkSize)
	{
		this(subStream, maxChunkSize, "$LENGTH");
	}

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		try
		{
			this.tagMap = tagMap;
			this.chunkBuf.clear();

			// do conversion of length by lengthConversionFunc
			int limit = this.lengthConversionFunc.apply(this.lengthTag.getNumber(tagMap).intValue());
			this.chunkBuf.limit(limit);
			this.notChunked = true;
			return true;
		}
		catch(IllegalArgumentException e)
		{
			throw new RuntimeException("A value of length tag is too big to set limit");
		}
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
	}

	@Override
	public int put(ByteBuffer buf) throws IOException
	{
		if ( !this.notChunked ) throw new IOException("Already buffer was chunked");
		else
		{
			int count = ByteBufferHelper.copy(buf, this.chunkBuf);

			if ( !hasRemaining() )
			{
				this.notChunked = false;

				this.chunkBuf.flip();
				while ( this.chunkBuf.hasRemaining() )
				{
					this.subStream.open(this.tagMap);
					this.subStream.put(this.chunkBuf);
					this.subStream.close(this.tagMap);

					if ( !this.subStream.hasRemaining() ) break;
				}
			}

			return count;
		}
	}
}
