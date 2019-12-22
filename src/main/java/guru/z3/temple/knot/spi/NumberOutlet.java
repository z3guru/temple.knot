/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.*;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.function.BiConsumer;

public class NumberOutlet extends NumberStream implements TagStreamOutlet
{
	protected Tag tag;
	protected BiConsumer<ByteBuffer, Number> fnPutBuffer;

	/**
	 * Define Factory
	 */
	final public static TagStreamOutlet.Factory Factory = (metadata) ->
	{
		String name = metadata.getName();
		TagType type = metadata.getParamMap().get(NumberStream.METADATA_TYPE, TagType.class);
		ByteOrder order = metadata.getParamMap().get(NumberStream.METADATA_BYTES_ORDER, ByteOrder.class, ByteOrder.BIG_ENDIAN);
		Integer customSize = metadata.getParamMap().get(NumberStream.METADATA_CUSTOM_SIZE, Integer.class);

		return new NumberOutlet(name, NumberType.convertFrom(type), order, customSize);
	};

	public NumberOutlet(String tagName, NumberType type, ByteOrder byteOrder)
	{
		this(tagName, type, byteOrder, null);
	}

	public NumberOutlet(String tagName, NumberType type, ByteOrder byteOrder, Integer customSize)
	{
		this.name = tagName;
		this.type = type;
		this.buf = ByteBuffer.allocate(customSize == null ? type.bytesSize() : customSize);
		this.buf.order(byteOrder);

		this.tag = Tag.newKey(name, type.tagType.klass());
		this.fnPutBuffer = customSize == null
						 ? type.funcPut()
						 : (buf, num) -> ByteBufferHelper.putInt(num.intValue(), buf, buf.capacity());

	}

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		Number num = getNumber(tagMap);
		if ( num == null ) return false;  // need to wait for a value would be assigned.

		this.buf.clear();
		this.fnPutBuffer.accept(this.buf, num);
		this.buf.flip();

		return true;
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
		// no-op
	}

	@Override
	public int get(ByteBuffer buf) throws IOException
	{
		return ByteBufferHelper.copy(this.buf, buf);
	}

	protected Number getNumber(TagMap tagMap)
	{
		return this.tag.getNumber(tagMap);
	}
}
