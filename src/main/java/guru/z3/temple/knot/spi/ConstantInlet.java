/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamInlet;
import guru.z3.temple.knot.TagType;

import java.nio.ByteOrder;

/**
 * This is for number, but the number is constant.
 */
public class ConstantInlet extends NumberInlet
{
	/**
	 * Define Factory
	 */
	final public static TagStreamInlet.Factory Factory = (metadata) ->
	{
		String name = metadata.getName();
		TagType type = metadata.getParamMap().get(NumberStream.METADATA_TYPE, TagType.class);
		ByteOrder byteOrder = metadata.getParamMap().get(NumberStream.METADATA_BYTES_ORDER, ByteOrder.class, ByteOrder.BIG_ENDIAN);
		Integer customSize = metadata.getParamMap().get(NumberStream.METADATA_CUSTOM_SIZE, Integer.class);

		return new ConstantInlet(name, NumberType.convertFrom(type), byteOrder, customSize);
	};

	public ConstantInlet(String tagName, NumberType type, ByteOrder byteOrder)
	{
		this(tagName, type, byteOrder, null);
	}

	public ConstantInlet(String tagName, NumberType type, ByteOrder byteOrder, Integer customSize)
	{
		super(tagName, type, byteOrder, customSize);
	}

	protected void putNumber(TagMap tagMap)
	{
		// No-op
	}
}
