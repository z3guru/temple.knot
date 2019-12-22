/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStreamOutlet;
import guru.z3.temple.knot.TagType;

import java.nio.ByteOrder;

/**
 * This is for number, but the number is constant.
 */
public class ConstantOutlet extends NumberOutlet
{
	protected Number constant;

	/**
	 * Define Factory
	 */
	final public static TagStreamOutlet.Factory Factory = (metadata) ->
	{
		String name = metadata.getName();
		TagType type = metadata.getParamMap().get(NumberStream.METADATA_TYPE, TagType.class);
		ByteOrder byteOrder = metadata.getParamMap().get(NumberStream.METADATA_BYTES_ORDER, ByteOrder.class, ByteOrder.BIG_ENDIAN);
		Integer customSize = metadata.getParamMap().get(NumberStream.METADATA_CUSTOM_SIZE, Integer.class);

		Number constant = (Number)metadata.getParamMap().get(NumberStream.METADATA_CONSTANT);

		return new ConstantOutlet(name, NumberType.convertFrom(type), byteOrder, constant, customSize);
	};

	public ConstantOutlet(String tagName, NumberType type, ByteOrder byteOrder, Number constant)
	{
		this(tagName, type, byteOrder, constant, null);
	}

	public ConstantOutlet(String tagName, NumberType type, ByteOrder byteOrder, Number constant, Integer customSize)
	{
		super(tagName, type, byteOrder, customSize);
		this.constant = constant;
	}

	protected Number getNumber(TagMap tagMap)
	{
		return this.constant;
	}
}
