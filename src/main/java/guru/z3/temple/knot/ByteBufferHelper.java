/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class ByteBufferHelper
{
	/**
	 * Put bytes of src to dest safely.
	 * @param src
	 * @param dest
	 * @return A number of copied
	 */
	public static int copy(ByteBuffer src, ByteBuffer dest)
	{
		int capable = dest.remaining();
		if ( capable == 0 ) return 0;

		int pos = dest.position(); // for calculating count of copied
		if ( capable < src.remaining() )
		{
			ByteBuffer sliced = src.slice();
			sliced.limit(capable);
			src.position(src.position() + capable);
			// copy...
			dest.put(sliced);
		}
		else
			dest.put(src);

		return dest.position() - pos;
	}

	/**
	 * 버퍼의 바이트 정보들을 16진수 문자열로 변환한다.
	 * @param buf 대상 버퍼
	 * @return 16진수 문자열
	 */
	public static String serialize(ByteBuffer buf)
	{
		return serialize(buf, null);
	}

	/**
	 * 버퍼의 바이트 정보들을 16진수 문자열로 변환한다.
	 * @param buf 대상 버퍼
	 * @return 16진수 문자열
	 */
	public static String serialize(ByteBuffer buf, String delimiter)
	{
		ByteBuffer dbuf = buf.duplicate();
		StringBuilder text = new StringBuilder();

		while(dbuf.hasRemaining())
		{
			byte b = dbuf.get();
			text.append(encode((b >> 4) & 0x0F));
			text.append(encode(b & 0x0F));
			if ( delimiter != null ) text.append(delimiter);
		}

		return text.toString();
	}


	/**
	 * parse hex string and convert that into {@link ByteBuffer} data
	 */
	public static ByteBuffer deserialize(String hex)
	{
		String hh = hex.replaceAll("\\s+", "");
		int length = hh.length() >> 1;
		ByteBuffer buf = ByteBuffer.allocate(length);

		int idx = 0;
		for ( int i = 0; i < length; i++ )
		{
			byte b = 0;
			int  mask = 4;
			do
			{
				int ch = hh.charAt(idx++);
				if ( ch >= 'a' ) ch = ch - 'a' + 10;
				else if ( ch >= 'A' ) ch = ch -'A' + 10;
				else
					ch -= '0';

				b |= ch << mask;
				mask -= 4;
			} while ( mask >= 0 );

			buf.put(b);
		}

		buf.flip();
		return buf;
	}

	/**
	 * 0~15까지의 값을 16진수 문자로 변환
	 */
	private static char encode(int val)
	{
		if (val < 10) return (char)('0' + val);
		else if (val < 16) return (char)('A' + val - 10);
		else return 'X';
	}

	/**
	 * 버퍼의 바이트 정보들을 16진수 문자열로 변환한다.
	 * @param buf 표현하고자 하는 버퍼
	 * @param count 한줄마다 표현할 바이트 수
	 * @return 구성된 문자열
	 */
	public static String toHexString(ByteBuffer buf, int count)
	{
		ByteBuffer dbuf = buf.duplicate();

		int hexpart = 3 * count;
		char[] line = new char[hexpart + count];
		StringBuffer text = new StringBuffer();

		int seg = 0;
		int idx1 = 0;
		int idx2 = 0;
		int idx3 = hexpart;

		while ( dbuf.hasRemaining() )
		{
			if ( ++idx1 > count )
			{
				idx1 = 1;
				idx2 = 0;
				idx3 = hexpart;
				text.append(String.format("%08X", seg)).append(": ").append(line).append("\n");
				seg += count;
			}

			byte b = dbuf.get();
			int val = (b & 0xF0) >> 4;
			line[idx2++] = (char)((val > 9) ? 'A' + (val - 10) : '0' + val);
			val = b & 0x0F;
			line[idx2++] = (char)((val > 9) ? 'A' + (val - 10) : '0' + val);
			line[idx2++] = ' ';
			line[idx3++] = (b >= 0x20 && b <= 0x7E) ? (char)b : '.';
		}

		if ( idx1 > 0 )
		{
			for ( int i = idx2; i < hexpart; i++ ) line[i] = ' ';
			text.append(String.format("%08X", seg)).append(": ").append(new String(line, 0, line.length - (count - idx1))).append("\n");
		}

		return text.toString();
	}

	public static int getInt(ByteBuffer buf, int count)
	{
		int num = 0;

		if ( buf.order() == ByteOrder.BIG_ENDIAN )
		{
			for ( int i = count - 1; i >= 0; i-- ) num |= (0xFF & buf.get()) << (8 * i);
		}
		else
		{
			for ( int i = 0; i < count; i++ ) num |= (0xFF & buf.get()) << (8 * i);
		}

		return num;
	}

	public static void putInt(int value, ByteBuffer buf, int count)
	{
		if ( buf.order() == ByteOrder.BIG_ENDIAN )
		{
			int num = value;
			int offset = 0xFF << ((count - 1) * 8);

			for ( int i = count - 1 ; i >= 0; i-- )
			{
				buf.put((byte)((num & offset) >> (i * 8)));
				offset >>= 8;
			}
		}
		else
		{
			int num = value;
			for ( int i = 0; i < count; i++ )
			{
				buf.put((byte)(num & 0xFF));
				num >>= 8;
			}
		}
	}

}
