/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

abstract public class ReadonlyValueMap implements ValueMap
{
	@Override
	public Object put(String name, Object value)
	{
		throw new RuntimeException("This value map is read-only");
	}

	@Override
	public void reset()
	{
		// NO-OP
	}
}
