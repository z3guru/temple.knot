package guru.z3.temple.knot;

import java.io.IOException;

/**
 * This class communicates with a device, collects data from the device and send a command to the device.
 */
public interface Craftsman
{
	/**
	 * Ready for data communication.
	 *
	 * @throws IOException
	 */
	void assign(Workshop workshop) throws IOException;

	/**
	 *
	 *
	 * @throws IOException
	 */
	Workshop assigned();

	/**
	 *
	 * @throws IOException
	 */
	void deassign() throws IOException;

	/**
	 * Start data communication, {@link Crafts} contains data whitch will be sent or will be received.
	 *
	 * @param crafts
	 * @param tool
	 * @throws IOException
	 */
	void work(Crafts crafts, Tool tool) throws IOException;

	/**
	 * Repeat data communication, {@link Crafts} contains data whitch will be sent or will be received.
	 *
	 * @param crafts
	 * @param tool
	 * @param interval repeat interval
	 * @param iterateCount if this is 0 then infinite, else repeat as many times as specified.
	 * @throws IOException
	 */
	void work(Crafts crafts, Tool tool, long interval, int iterateCount) throws IOException;

	///
	/**
	 * Create a instance of {@link Craftsman} and build it
	 */
	interface Builder
	{
		public Craftsman build() throws IllegalStateException;
	}
}
