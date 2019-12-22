package guru.z3.temple.knot;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * By this interface, a class receives a stream(bytes)
 */
public interface TagStreamInlet extends TagStream
{
	/**
	 * A implemented class receives {@link ByteBuffer} for receiving a array of bytes
	 *
	 * @param buf
	 * @return count of bytes put
	 *
	 * @throws IOException
	 */
	public int put(ByteBuffer buf) throws IOException;

	interface Factory
	{
		public TagStreamInlet create(TagStreamMetadata metadata);
	}
}
