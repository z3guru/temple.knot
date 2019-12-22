/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.ValueMap;

import java.util.HashMap;
import java.util.function.BiConsumer;

public class HashValueMap extends HashMap<String,Object> implements ValueMap
{
	@Override
	public Object get(String name)
	{
		return get((Object)name);
	}

	@Override
	public void reset()
	{
		clear();
	}

	@Override
	public void forEach(BiConsumer consumer)
	{
		super.forEach(consumer);
	}
}
