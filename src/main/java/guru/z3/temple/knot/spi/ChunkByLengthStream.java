/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.Tag;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStream;

import java.nio.ByteBuffer;
import java.util.function.Function;

public abstract class ChunkByLengthStream<T extends TagStream> extends OpenSafelyTagStream
{
	/** Chunk buffer */
	protected ByteBuffer chunkBuf;
	/** */
	protected Tag<Integer> lengthTag;
	/** */
	protected T subStream;
	/** */
	protected TagMap tagMap;

	protected Function<Integer,Integer> lengthConversionFunc = length -> length;

	@Override
	public boolean hasRemaining()
	{
		return this.chunkBuf.hasRemaining();
	}

	public void setLengthChangeFunction(Function<Integer,Integer> func)
	{
		if ( func != null ) this.lengthConversionFunc = func;
	}
}
