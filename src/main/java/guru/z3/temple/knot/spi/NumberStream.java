/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import java.nio.ByteBuffer;

abstract public class NumberStream extends OpenSafelyTagStream
{
	final static public String METADATA_TYPE			= "number.type";
	final static public String METADATA_BYTES_ORDER		= "number.bytes.order";
	final static public String METADATA_CUSTOM_SIZE		= "number.custom.size";
	final static public String METADATA_CONSTANT		= "number.constant";

	/**  */
	protected NumberType type;
	/** keep bytes  */
	protected ByteBuffer buf;

	@Override
	public boolean hasRemaining()
	{
		return this.buf.hasRemaining();
	}
}
