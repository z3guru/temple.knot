package unittest.knot.nashorn;

import guru.z3.temple.knot.Yarn;

import java.io.IOException;
import java.nio.BufferOverflowException;
import java.nio.ByteBuffer;

public class MockHsmsYarn implements Yarn
{
	private ByteBuffer stream;

	public MockHsmsYarn()
	{
		this.stream = ByteBuffer.wrap(new byte[] { 0x00, 0x00, 0x00, 0x0F, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01 });
	}

	@Override
	public ByteBuffer source(int length) throws IOException
	{
		if ( this.stream.remaining() >= length )
		{
			int newpos = this.stream.position() + length;

			ByteBuffer buf = this.stream.duplicate();
			this.stream.position(newpos);
			buf.limit(newpos);

			return buf;
		}

		throw new BufferOverflowException();
	}

	public void reset()
	{
		this.stream.reset();
	}
}
