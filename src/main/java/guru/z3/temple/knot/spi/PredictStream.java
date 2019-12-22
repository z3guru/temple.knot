/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.TagMap;
import guru.z3.temple.knot.TagStream;

import java.util.Map;
import java.util.function.Function;

public class PredictStream<T extends TagStream> extends OpenSafelyTagStream
{
	/** sub {@link TagStream} map */
	protected Map<String,T> subMap;
	/** */
	protected T workStream;

	protected Function<TagMap,String> predictFunction;

	@Override
	protected boolean openImpl(TagMap tagMap) throws RuntimeException
	{
		if ( this.workStream == null )
		{
			String name = this.predictFunction.apply(tagMap);
			this.workStream = this.subMap.get(name);
			if ( this.workStream == null ) throw new RuntimeException("Predict is fail");
		}

		return this.workStream.open(tagMap);
	}

	@Override
	protected void closeImpl(TagMap tagMap) throws RuntimeException
	{
		if ( this.workStream != null ) this.workStream.close(tagMap);
		this.workStream = null;
	}

	@Override
	public boolean hasRemaining()
	{
		return this.workStream != null && this.workStream.hasRemaining();
	}

	// GETTER/SETTER methods =====================
	public Function<TagMap, String> getPredictFunction() { return predictFunction; }
	public void setPredictFunction(Function<TagMap, String> predictFunction) { this.predictFunction = predictFunction; }

	public Map<String, T> getSubMap() { return subMap; }
	public void setSubMap(Map<String, T> subMap) { this.subMap = subMap; }
}
