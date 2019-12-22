/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.Tag;
import guru.z3.temple.knot.TagIterator;
import guru.z3.temple.knot.TagMap;

import java.util.List;
import java.util.function.BiConsumer;

public class IndexedNameTagMap implements TagMap, TagIterator
{
	private TagMap linkedService;

	/** Restrict the target tags, if null then all tags are targets */
	private List<String> targetNames;

	private Tag<Integer> loopCountTag;
	private int limitIndex;
	private int index;

	public IndexedNameTagMap()
	{
	}

	public IndexedNameTagMap(List<String> targetNames, String loopCountTagName)
	{
		this.targetNames = targetNames;
		this.loopCountTag = Tag.newKey(loopCountTagName, Integer.class);
	}

	@Override
	public void link(TagMap service)
	{
		this.linkedService = service;
		this.limitIndex = this.loopCountTag.getNumber(service).intValue();
		this.index = -1;
	}

	@Override
	public TagIterator iterator()
	{
		return this;
	}

	@Override
	public Object get(String name)
	{
		boolean isTarget = this.targetNames == null || this.targetNames.contains(name);

		if ( isTarget && this.linkedService != null )
		{
			String indexedName = new StringBuilder()
									 .append(name).append('[').append(this.index).append(']')
									 .toString();
			return this.linkedService.get(indexedName);
		}
		else
			return this.linkedService == null ? null : this.linkedService.get(name);
	}

	@Override
	public Object put(String name, Object value)
	{
		boolean isTarget = this.targetNames == null || this.targetNames.contains(name);

		if ( isTarget && this.linkedService != null )
		{
			String indexedName = new StringBuilder()
					.append(name).append('[').append(this.index).append(']')
					.toString();
			return this.linkedService.put(indexedName, value);
		}
		else
			return this.linkedService == null ? null : this.linkedService.put(name, value);
	}

	@Override
	public boolean moveNext()
	{
		return ++this.index < this.limitIndex;
	}

	@Override
	public void reset()
	{
		this.index = -1;
	}

	@Override
	public void forEach(BiConsumer<String, Object> consumer)
	{
		this.linkedService.forEach(consumer);
	}
}
