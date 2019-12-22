package guru.z3.temple.knot;

public enum TagType
{
	Byte, Short, Integer, Long, Float, Double, String;

	/** this attribute represents type */
	protected Class klass;

	TagType()
	{
		switch(this.ordinal())
		{
			case 0 /*Byte*/		: this.klass = Byte.class; break;
			case 1 /*Short*/	: this.klass = Short.class; break;
			case 2 /*Integer*/	: this.klass = Integer.class; break;
			case 3 /*Long*/		: this.klass = Long.class; break;
			case 4 /*Float*/	: this.klass = Float.class; break;
			case 5 /*Double*/	: this.klass = Double.class; break;
			case 6 /*String*/	: this.klass = String.class; break;
		}
	}

	public Class<? extends Number> klass()
	{
		return this.klass;
	}

	static public TagType convertFrom(Class klass) throws IllegalArgumentException
	{
		try { return valueOf(klass.getSimpleName()); }
		catch(Exception e)
		{
			throw new IllegalArgumentException("Unsupported class:" + klass.getName());
		}
	}
}
