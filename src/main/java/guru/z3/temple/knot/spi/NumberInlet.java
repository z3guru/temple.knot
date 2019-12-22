/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.ByteBufferHelper;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamInlet;
import guru.z3.temple.knot.TagType;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.function.Function;

public class NumberInlet extends NumberStream implements TagStreamInlet
{
	protected String tagName;

	protected Function<ByteBuffer, Number> fnGetBuffer;

	/**
	 * Define Factory
	 */
	final public static TagStreamInlet.Factory Factory = (metadata) ->
	{
		String name = metadata.getName();
		TagType type = metadata.getParamMap().get(NumberStream.METADATA_TYPE, TagType.class);
		ByteOrder order = metadata.getParamMap().get(NumberStream.METADATA_BYTES_ORDER, ByteOrder.class, ByteOrder.BIG_ENDIAN);
		Integer customSize = metadata.getParamMap().get(NumberStream.METADATA_CUSTOM_SIZE, Integer.class);

		return new NumberInlet(name, NumberType.convertFrom(type), order, customSize);
	};

	public NumberInlet(String tagName, NumberType type, ByteOrder byteOrder)
	{
		this(tagName, type, byteOrder, null);
	}

	public NumberInlet(String tagName, NumberType type, ByteOrder byteOrder, Integer customSize)
	{
		this.name = this.tagName = tagName;
		this.type = type;
		this.buf = ByteBuffer.allocate(customSize == null ? type.bytesSize() : customSize);
		this.buf.order(byteOrder);

		this.fnGetBuffer = customSize == null
						 ? type.funcGet()
						 : buf -> ByteBufferHelper.getInt(buf, buf.capacity());
	}

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		this.buf.clear();
		return true;
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
		this.buf.flip();
		putNumber(tagMap);
	}

	@Override
	public int put(ByteBuffer source) throws IOException
	{
		return ByteBufferHelper.copy(source, this.buf);
	}

	protected void putNumber(TagMap tagMap)
	{
		tagMap.put(this.tagName, this.fnGetBuffer.apply(this.buf));
	}
}
