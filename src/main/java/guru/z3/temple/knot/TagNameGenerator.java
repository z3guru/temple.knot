/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

import java.io.IOException;

/**
 * This class can make a key of a tag continuously.
 */
public interface TagNameGenerator
{
	/**
	 * genrating a tag's name
	 *
	 * @return name
	 * @throws IOException
	 */
	public String nextName();

	/**
	 * Reset generating
	 * @throws IOException
	 */
	public void reset();
}
