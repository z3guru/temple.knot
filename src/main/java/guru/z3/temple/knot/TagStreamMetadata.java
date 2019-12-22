/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

import guru.z3.temple.knot.spi.HashValueMap;

import java.util.LinkedList;
import java.util.List;

/**
 * A data for creating {@link TagStream}
 */
public class TagStreamMetadata
{
	private String name;
	private ValueMap paramMap;
	private List<TagStreamMetadata> subMetadata;

	private Class<? extends TagStreamInlet> inletClass;
	private Class<? extends TagStreamOutlet> outletClass;

	private TagStreamMetadata(String name, ValueMap paramMap)
	{
		this.name = name;
		this.paramMap = paramMap;
		this.subMetadata = new LinkedList<>();
	}

	public static TagStreamMetadata newInstance(
			String name
			, Class<? extends TagStreamInlet> inletClass
			, Class<? extends TagStreamOutlet> outletClass)
	{
		TagStreamMetadata metadata = new TagStreamMetadata(name, new HashValueMap());
		metadata.inletClass = inletClass;
		metadata.outletClass = outletClass;

		return metadata;
	}

	public TagStreamMetadata addParameter(String name, Object param)
	{
		this.paramMap.put(name, param);
		return this;
	}

	public TagStreamMetadata addSubMetadata(TagStreamMetadata metadata)
	{
		this.subMetadata.add(metadata);
		return this;
	}

	public TagStreamMetadata addSubMetadata(List<TagStreamMetadata> metadataList)
	{
		this.subMetadata.addAll(metadataList);
		return this;
	}

	public TagStreamInlet createTagStreamInlet() throws RuntimeException
	{
		if ( this.inletClass == null ) return null;

		try
		{
			TagStreamInlet.Factory factory =
					(TagStreamInlet.Factory)this.inletClass.getField("Factory").get(null);

			return factory.create(this);
		}
		catch(NoSuchFieldException e) { throw new RuntimeException(); }
		catch(IllegalAccessException e) { throw new RuntimeException(); }
	}

	public TagStreamOutlet createTagStreamOutlet(Class klass) throws RuntimeException
	{
		if ( this.outletClass == null ) return null;

		try
		{
			TagStreamOutlet.Factory factory =
					(TagStreamOutlet.Factory)this.outletClass.getField("Factory").get(null);

			return factory.create(this);
		}
		catch(NoSuchFieldException e) { throw new RuntimeException(); }
		catch(IllegalAccessException e) { throw new RuntimeException(); }
	}

	// GETTER/SETTER methods =====================
	public String getName() { return name; }

	public ValueMap getParamMap() { return paramMap; }

	public List<TagStreamMetadata> getSubMetadata() { return subMetadata; }
}
