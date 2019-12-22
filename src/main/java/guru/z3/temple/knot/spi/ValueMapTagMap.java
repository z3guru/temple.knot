/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagIterator;
import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.ValueMap;

import java.util.function.BiConsumer;

public class ValueMapTagMap implements TagMap
{
	private ValueMap vmap;

	private int serialNumber;
	private int phase;

	private ValueMapTagMap()
	{
	}

	public static ValueMapTagMap wrap(ValueMap vmap)
	{
		ValueMapTagMap instance = new ValueMapTagMap();
		instance.vmap = vmap;
		return instance;
	}

	@Override
	public void link(TagMap service)
	{
	}

	@Override
	public TagIterator iterator()
	{
		return null;
	}

	@Override
	public Object get(String name)
	{
		return this.vmap.get(name);
	}

	@Override
	public Object put(String name, Object value)
	{
		return this.vmap.put(name, value);
	}

	@Override
	public void reset()
	{
		this.vmap.reset();
	}

	@Override
	public void forEach(BiConsumer<String, Object> consumer)
	{
		this.vmap.forEach(consumer);
	}


	// GETTER/SETTER methods =====================
	public int getSerialNumber() { return serialNumber; }
	public void setSerialNumber(int serialNumber) { this.serialNumber = serialNumber; }

	public int getPhase() { return phase; }
	public void setPhase(int phase) { this.phase = phase; }
}
