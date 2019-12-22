/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

/**
 * {@link Tag} into stream or stream into {@link Tag}
 */
public interface TagStream
{
	/**
	 *
	 * @param tagMap
	 * @throws RuntimeException
	 */
	boolean open(TagMap tagMap) throws RuntimeException;

	/**
	 *
	 * @param tagMap
	 * @throws RuntimeException
	 */
	void close(TagMap tagMap) throws RuntimeException;

	/**
	 * return whether is this opened
	 * @throws RuntimeException
	 */
	boolean isOpened();

	/**
	 * Check is there more data to be taken.
	 * @return true, if there is more data.
	 */
	boolean hasRemaining();
}
