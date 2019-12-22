/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.ByteBufferHelper;
import guru.z3.temple.knot.Tag;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamOutlet;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.function.BiConsumer;

public class BitOutlet extends BitStream implements TagStreamOutlet
{
	final public static TagStreamOutlet.Factory Factory = (metadata) ->
	{
		BitOutlet instance = new BitOutlet();
		instance.name = metadata.getName();
		instance.tag = Tag.newKey(metadata.getName(), Byte.class);

		int size = metadata.getParamMap().get("bit.size", Integer.class);
		instance.buf = ByteBuffer.allocate(size);

		instance.chunkSize = metadata.getParamMap().get("bit.chunk.type", Integer.class);
		switch(instance.chunkSize)
		{
			case 1: instance.chunkFunc = (buf, num) -> buf.put(num.byteValue()); break;
			case 2: instance.chunkFunc = (buf, num) -> buf.putShort(num.shortValue()); break;
		}

		instance.chunkOrder = metadata.getParamMap().get("bit.chunk.order", Integer.class);

		return instance;
	};

	protected Tag tag;
	protected BiConsumer<ByteBuffer, Integer> chunkFunc;

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		int count = this.chunkSize * 8;
		int bb = this.chunkOrder == 0 ? normalCall(tagMap, count) : reverseCall(tagMap, count);

		this.chunkFunc.accept(this.buf, bb);
		this.buf.flip();

		return true;
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
	}

	@Override
	public int get(ByteBuffer buf) throws IOException
	{
		return ByteBufferHelper.copy(this.buf, buf);
	}

	private int normalCall(TagMap foup, int size)
	{
		int offset = 0x01 << (size - 1);
		int bb = 0;

		for ( int i = 0; i < size; i++ )
		{
			if ( foup.iterator() != null ) foup.iterator().moveNext();
			if ( this.tag.getNumber(foup).intValue() > 0 ) bb |= offset;
			offset >>= 1;
		}

		return bb;
	}

	private int reverseCall(TagMap foup, int size)
	{
		int offset = 0x01;
		int bb = 0;

		for ( int i = 0; i < size; i++ )
		{
			if ( foup.iterator() != null ) foup.iterator().moveNext();
			if ( this.tag.getNumber(foup).intValue() > 0 ) bb |= offset;
			offset <<= 1;
		}

		return bb;
	}
}
