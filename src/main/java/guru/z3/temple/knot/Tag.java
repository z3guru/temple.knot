/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

public class Tag<V>
{
	protected String name;
	protected Class<V> valueClass;

	protected Tag(String name, Class<V> valueClass)
	{
		this.name = name;
		this.valueClass = valueClass;
	}

	public static <T> Tag<T> newKey(String name, Class<T> klass) throws IllegalArgumentException
	{
		if ( klass == null ) throw new IllegalArgumentException("Class must be defined");
		return new Tag(name, klass);
	}

	public V getValue(ValueMap vmap)
	{
		return vmap.get(this.name, this.valueClass);
	}

	/**
	 * Put a value with {@link Tag}.
	 *
	 * @param value new value
	 * @return the previous value associated with name, or null if there was none.
	 */
	public Object setValue(ValueMap vmap, V value)
	{
		return vmap.put(this.name, value);
	}

	public Number getNumber(ValueMap vmap)
	{
		return vmap.getNumber(this.name, this.valueClass);
	}

	public Number getNumber(ValueMap vmap, Number defaultValue)
	{
		return vmap.getNumber(this.name, Number.class, defaultValue);
	}

	public int getInt(ValueMap vmap) { return vmap.getInt(this.name); }
	public long getLong(ValueMap vmap) { return vmap.getLong(this.name); }
	public float getFloat(ValueMap vmap) { return vmap.getFloat(this.name); }
	public double getDouble(ValueMap vmap) { return vmap.getDouble(this.name); }

	// GETTER/SETTER methods =====================
	public String getName() { return name; }

	public Class<V> getValueClass() { return valueClass; }
}
