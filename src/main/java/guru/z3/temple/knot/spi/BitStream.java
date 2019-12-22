/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import java.nio.ByteBuffer;

abstract public class BitStream extends OpenSafelyTagStream
{
	/** keep bytes putted */
	protected ByteBuffer buf;

	/** 0:nible, 1:byte, 2:word, 3:dword */
	protected int chunkSize;
	/** 0:normal, 1:reverse */
	protected int chunkOrder;


	@Override
	public boolean hasRemaining()
	{
		return this.buf.hasRemaining();
	}
}
