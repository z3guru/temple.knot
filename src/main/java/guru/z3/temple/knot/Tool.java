/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

import java.io.IOException;
import java.nio.ByteBuffer;

public interface Tool
{
	/**
	 * Pack a processed data of {@link Crafts} into {@link ByteBuffer}
	 * @param tagMap
	 * @return if there is more data, then return true
	 */
	void streaming(Craftsman cman, final TagMap tagMap) throws IOException;

	///
	/**
	 * Create a instance of {@link Craftsman} and build it
	 */
	interface Builder
	{
		public Tool build() throws IllegalStateException;
	}
}
