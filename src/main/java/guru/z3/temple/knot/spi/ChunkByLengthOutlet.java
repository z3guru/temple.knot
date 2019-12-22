/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.*;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.function.Function;

public class ChunkByLengthOutlet extends ChunkByLengthStream<TagStreamOutlet> implements TagStreamOutlet
{
	/** */
	private boolean notGetSubs;

	final public static TagStreamOutlet.Factory Factory = (metadata) ->
	{
		TagStreamOutlet sub = null;
		if ( metadata.getSubMetadata() != null )
		{
			TagStreamMetadata subMeta = metadata.getSubMetadata().get(0);
			sub = subMeta.createTagStreamOutlet(TagStreamOutlet.class);
		}

		int chunksSize = Integer.parseInt(metadata.getParamMap().get("chunk.buf.size").toString());
		String lengthTagName = String.valueOf(metadata.getParamMap().get("chunk.buf.tagname"));

		ChunkByLengthOutlet instance = new ChunkByLengthOutlet(sub, chunksSize, lengthTagName);
		instance.name = metadata.getName();
		instance.setLengthChangeFunction(metadata.getParamMap().get("chunk.length.func.outlet", Function.class));

		return instance;
	};

	public ChunkByLengthOutlet(TagStreamOutlet subStream, int maxChunkSize, String lengthTagName)
	{
		this.subStream = subStream;
		this.chunkBuf = ByteBuffer.allocate(maxChunkSize);
		this.lengthTag = Tag.newKey(lengthTagName, Integer.class);
	}

	public ChunkByLengthOutlet(TagStreamOutlet subStream, int maxChunkSize)
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
			this.notGetSubs = true;

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
		if ( !this.notGetSubs )
		{
			// do conversion of length by lengthConversionFunc
			tagMap.put(lengthTag.getName(), this.lengthConversionFunc.apply(this.chunkBuf.limit()));
		}
	}

	@Override
	public int get(ByteBuffer buf) throws IOException
	{
		// Get all bytes from suboutlet...
		if ( this.notGetSubs )
		{
			if ( this.subStream != null )
			{
				this.subStream.open(this.tagMap);
				int count = this.subStream.get(this.chunkBuf);
				this.subStream.close(this.tagMap);
			}

			this.chunkBuf.flip();
			this.notGetSubs = false;
		}

		return ByteBufferHelper.copy(this.chunkBuf, buf);
	}
}
