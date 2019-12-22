package guru.z3.temple.knot;

import org.slf4j.LoggerFactory;

import java.util.function.BiConsumer;
import java.util.function.Function;

public interface ValueMap
{
	static final public Function<String, Integer> 	PARSE_INT 		= (s) -> Integer.parseInt(s);
	static final public Function<String, Long> 		PARSE_LONG		= (s) -> Long.parseLong(s);
	static final public Function<String, Float>  	PARSE_FLOAT		= (s) -> Float.parseFloat(s);
	static final public Function<String, Double>  	PARSE_DOUBLE	= (s) -> Double.parseDouble(s);

	/**
	 * Get the {@link Tag} from map. If there isn't, create new instance of {@link Tag} and return it.
	 *
	 * @param name
	 * @return value with the name, if error then null
	 */
	Object get(String name);

	/**
	 * Put a {@link Tag}. if there is one with the name of 1st parameter, that is replaced by 2nd parameter.
	 *
	 * @param name
	 * @param value new value
	 * @return the previous value associated with name, or null if there was none.
	 */
	Object put(String name, Object value);

	/**
	 * Reset data in this map for reworking...
	 */
	void reset();

	/**
	 * traverse all entries this map, call function with parameters name(key), value for each entry
	 */
	void forEach(BiConsumer<String, Object> consumer);


	/**
	 * Get a value with name & class
	 *
	 * @param name
	 * @param klass
	 * @return
	 */
	default <T> T get(String name, Class<T> klass)
	{
		return (T)get(name);
	}

	default <T> T get(String name, Class<T> klass, T defaultValue)
	{
		Object value = get(name);
		return value == null ? defaultValue : (T)value;
	}

	default <T> T get(String name, Function<String, T> func, T defaultValue)
	{
		Object value = get(name);
		return value == null ? defaultValue : func.apply(value.toString());
	}

	default int getInt(String name)
	{
		return getNumber(name, Integer.class).intValue();
	}

	default long getLong(String name)
	{
		return getNumber(name, Long.class).longValue();
	}

	default float getFloat(String name)
	{
		return getNumber(name, Float.class).floatValue();
	}

	default double getDouble(String name)
	{
		return getNumber(name, Double.class).doubleValue();
	}

	default <T> Number getNumber(String name, Class<T> klass)
	{
		Object value = get(name);
		if ( value == null ) return null;

		try
		{
			Number returnValue = null;

			if ( Number.class.isAssignableFrom(value.getClass()) )
			{
				returnValue = (Number)value;
			}
			else
			{
				Function func = null;

				if ( Integer.class.isAssignableFrom(klass) ) func = PARSE_INT;
				else if ( Long.class.isAssignableFrom(klass) ) func = PARSE_LONG;
				else if ( Float.class.isAssignableFrom(klass) ) func = PARSE_FLOAT;
				else if ( Double.class.isAssignableFrom(klass) ) func = PARSE_DOUBLE;
				else
					return null;

				returnValue = (Number)func.apply(value.toString());
			}

			return returnValue;
		}
		catch(Exception e)
		{
			LoggerFactory.getLogger(ValueMap.class).error(e.getMessage(), e);
		}

		return null;
	}

	default <T extends Number> Number getNumber(String name, Class<T> klass, T defaultValue)
	{
		Number num = getNumber(name, klass);
		return num == null ? defaultValue : num;
	}

}
