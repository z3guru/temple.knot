/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagType;

import java.nio.ByteBuffer;
import java.util.function.BiConsumer;
import java.util.function.Function;

/**
 * This tool handles Fixed multiple bytes data.
 */
public enum NumberType
{
	Byte, Short, Integer, Long, Float, Double;

	protected BiConsumer<ByteBuffer, Number> fnPutBuffer;
	protected Function<ByteBuffer, Number> fnGetBuffer;
	protected int size;
	protected TagType tagType;

	NumberType()
	{
		switch(this.ordinal())
		{
			case 0 /*Byte*/:
				this.fnPutBuffer = (buf, num) -> buf.put(num.byteValue());
				this.fnGetBuffer = buf -> buf.get();
				this.tagType = TagType.Byte;
				this.size = 1;
				break;
			case 1 /*Short*/:
				this.fnPutBuffer = (buf, num) -> buf.putShort(num.shortValue());
				this.fnGetBuffer = buf -> buf.getShort();
				this.tagType = TagType.Short;
				this.size = 2;
				break;
			case 2 /*Integer*/:
				this.fnPutBuffer = (buf, num) -> buf.putInt(num.intValue());
				this.fnGetBuffer = buf -> buf.getInt();
				this.tagType = TagType.Integer;
				this.size = 4;
				break;
			case 3 /*Long*/:
				this.fnPutBuffer = (buf, num) -> buf.putLong(num.longValue());
				this.fnGetBuffer = buf -> buf.getLong();
				this.tagType = TagType.Long;
				this.size = 8;
				break;
			case 4 /*Float*/:
				this.fnPutBuffer = (buf, num) -> buf.putFloat(num.floatValue());
				this.fnGetBuffer = buf -> buf.getFloat();
				this.tagType = TagType.Float;
				this.size = 4;
				break;
			case 5 /*Double*/:
				this.fnPutBuffer = (buf, num) -> buf.putDouble(num.doubleValue());
				this.fnGetBuffer = buf -> buf.getDouble();
				this.tagType = TagType.Double;
				this.size = 8;
				break;
		}
	}

	public BiConsumer<ByteBuffer, Number> funcPut()
	{
		return this.fnPutBuffer;
	}

	public Function<ByteBuffer, Number> funcGet()
	{
		return this.fnGetBuffer;
	}

	public TagType tagType()
	{
		return this.tagType;
	}

	public int bytesSize()
	{
		return this.size;
	}

	static public NumberType convertFrom(TagType tagType)
	{
		switch(tagType)
		{
			case Byte		: return NumberType.Byte;
			case Short		: return NumberType.Short;
			case Integer	: return NumberType.Integer;
			case Long		: return NumberType.Long;
			case Float		: return NumberType.Float;
			case Double		: return NumberType.Double;
			default:
				throw new RuntimeException("Not number:" + tagType);
		}
	}
}
