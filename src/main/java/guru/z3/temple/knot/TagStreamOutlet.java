package guru.z3.temple.knot;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * A caller can takes data from a class implements this interface.
 */
public interface TagStreamOutlet extends TagStream
{
	/**
	 * A caller can takes a array of bytes by using {@link ByteBuffer}
	 *
	 * @param buf
	 * @return length of bytes packed into buf
	 * @throws IOException
	 */
	public int get(ByteBuffer buf) throws IOException;

	interface Factory
	{
		public TagStreamOutlet create(TagStreamMetadata metadata);
	}
}
