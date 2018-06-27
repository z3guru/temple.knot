package guru.z3.temple.knot;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 *	The class Workshop is
 *
 */
public interface Yarn
{
	/**
	 * prepare to work
	 */
	public ByteBuffer source(int length) throws IOException;
}
