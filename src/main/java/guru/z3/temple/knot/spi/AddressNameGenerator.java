/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagNameGenerator;

import java.text.DecimalFormat;

public class AddressNameGenerator implements TagNameGenerator
{
	private DecimalFormat formatter;

	/** start address */
	private int base;
	/** offset of address, real address = base + offset */
	private int offset;

	public AddressNameGenerator(String format)
	{
		this.formatter = new DecimalFormat(format);
		this.base = 0;
	}

	public static AddressNameGenerator newInstance(int base, String format)
	{
		AddressNameGenerator instance = new AddressNameGenerator(format);
		instance.base = base;

		return instance;
	}

	public static AddressNameGenerator newInstance(int base)
	{
		return newInstance(base, "000000");
	}

	public static AddressNameGenerator newInstance()
	{
		return newInstance(0);
	}


	@Override
	public String nextName()
	{
		return this.formatter.format(this.base + this.offset++);
	}

	@Override
	public void reset()
	{
		this.offset = 0;
	}

	// GETTER/SETTER methods =====================
	public DecimalFormat getFormatter() { return formatter; }
	public void setFormatter(DecimalFormat formatter) { this.formatter = formatter; }

	public int getBase() { return base; }
	public void setBase(int base) { this.base = base; }

	public int getOffset() { return offset; }
	public void setOffset(int offset) { this.offset = offset; }
}
