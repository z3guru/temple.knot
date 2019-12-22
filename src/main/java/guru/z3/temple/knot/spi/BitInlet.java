/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.ByteBufferHelper;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamInlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.function.Function;

public class BitInlet extends BitStream implements TagStreamInlet
{
	final public static TagStreamInlet.Factory Factory = (metadata) ->
	{
		BitInlet instance = new BitInlet();
		instance.tagName = metadata.getName();

		int size = metadata.getParamMap().get("bit.size", Integer.class);
		instance.buf = ByteBuffer.allocate(size);

		instance.chunkSize = metadata.getParamMap().get("bit.chunk.type", Integer.class);
		switch(instance.chunkSize)
		{
			case 1: instance.chunkFunc = buf -> Integer.valueOf(0xFF & buf.get()); break;
			case 2: instance.chunkFunc = buf -> Integer.valueOf(0xFFFF & buf.getShort()); break;
		}

		instance.chunkOrder = metadata.getParamMap().get("bit.chunk.order", Integer.class);

		return instance;
	};

	protected String tagName;
	protected Function<ByteBuffer, Integer> chunkFunc;

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		return true;
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
		this.buf.flip();

		// Skeip nibble;
		int count = this.chunkSize * 8;
		while ( this.buf.hasRemaining() )
		{
			int bb = chunkFunc.apply(this.buf);

			if ( this.chunkOrder == 0 ) normalCall(tagMap, bb, count);
			else
				reverseCall(tagMap, bb, count);
		}
	}

	@Override
	public int put(ByteBuffer buf) throws IOException
	{
		return ByteBufferHelper.copy(buf, this.buf);
	}

	private void normalCall(TagMap foup, int bb, int size)
	{
		int offset = 0x01 << (size - 1);
		for ( int i = 0; i < size; i++ )
		{
			if ( foup.iterator() != null ) foup.iterator().moveNext();

			foup.put(this.tagName, (bb & offset) == 0 ? 0 : 1);
			offset >>= 1;
		}
	}

	private void reverseCall(TagMap foup, int bb, int size)
	{
		int offset = 0x01;
		for ( int i = 0; i < size; i++ )
		{
			if ( foup.iterator() != null ) foup.iterator().moveNext();

			foup.put(this.tagName, (bb & offset) == 0 ? 0 : 1);
			offset <<= 1;
		}
	}
}
