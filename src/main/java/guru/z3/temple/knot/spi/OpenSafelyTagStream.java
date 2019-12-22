package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStream;

abstract public class OpenSafelyTagStream implements TagStream
{
	protected String name;
	protected boolean isOpend;

	@Override
	final public boolean open(TagMap tagMap) throws RuntimeException
	{
		this.isOpend = this.isOpend || openImpl(tagMap);
		return this.isOpend;
	}

	@Override
	final public void close(TagMap tagMap) throws RuntimeException
	{
		if ( this.isOpend )
		{
			closeImpl(tagMap);
			this.isOpend = false;
		}
	}
	@Override
	final public boolean isOpened()
	{
		return this.isOpend;
	}

	abstract protected boolean openImpl(TagMap tagMap) throws RuntimeException;

	abstract protected void closeImpl(TagMap tagMap) throws RuntimeException;

	// GETTER/SETTER methods =====================
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
}
