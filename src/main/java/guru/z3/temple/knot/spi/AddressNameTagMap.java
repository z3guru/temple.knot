/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.Tag;
import guru.z3.temple.knot.TagIterator;
import guru.z3.temple.knot.TagMap;

import java.util.function.BiConsumer;

public class AddressNameTagMap implements TagMap, TagIterator
{
	private TagMap linkedService;
	private AddressNameGenerator nameGenerator;

	private String targetName;
	private String nextTagName;

	private Tag<Integer> baseIndexTag;
	private Tag<Integer> loopCountTag;
	private int limitOffset;

	public AddressNameTagMap(String targetName, AddressNameGenerator nameGenerator)
	{
		this(targetName, nameGenerator, "TS" + "$baseIndex", "TS" + "$loopCount");
	}

	public AddressNameTagMap(String targetName, AddressNameGenerator nameGenerator, String baseIndexTagName, String loopCountTagName)
	{
		this.targetName = targetName;
		this.nameGenerator = nameGenerator;

		this.baseIndexTag = baseIndexTagName == null ? null : Tag.newKey(baseIndexTagName, Integer.class);
		this.loopCountTag = Tag.newKey(loopCountTagName, Integer.class);
	}

	@Override
	public void link(TagMap service)
	{
		this.linkedService = service;

		int base = baseIndexTag == null ? 0 : this.baseIndexTag.getInt(service);
		this.nameGenerator.setBase(base);
		this.nameGenerator.reset();
		this.limitOffset = this.loopCountTag.getNumber(service).intValue();
	}

	@Override
	public TagIterator iterator()
	{
		return this;
	}

	@Override
	public Object get(String name)
	{
		String tagName = this.targetName.equals(name) ? this.nextTagName : name;
		return this.linkedService == null ? null : this.linkedService.get(tagName);
	}

	@Override
	public Object put(String name, Object value)
	{
		String tagName = this.targetName.equals(name) ? this.nextTagName : name;
		return this.linkedService == null ? null : this.linkedService.put(tagName, value);
	}

	@Override
	public boolean moveNext()
	{
		this.nextTagName = this.nameGenerator.nextName();
		return this.nextTagName != null && this.nameGenerator.getOffset() <= this.limitOffset;  // because nextName() is called on very the above line
	}

	@Override
	public void reset()
	{
		this.nameGenerator.reset();
	}

	@Override
	public void forEach(BiConsumer<String, Object> consumer)
	{
		this.linkedService.forEach(consumer);
	}
}
