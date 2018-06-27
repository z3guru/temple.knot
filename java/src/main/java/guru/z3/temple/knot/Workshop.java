package guru.z3.temple.knot;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class Workshop
{
	private Map<String, CraftsMan> men;
	private final Map<String, Object> references = new HashMap();

	public Workshop()
	{
		this.men = new HashMap();
	}

	/**
	 * hand over work to {@link CraftsMan}
	 *
	 * @param name a name of {@link CraftsMan}
	 * @throws IOException
	 */
	public void handOver(String name) throws IOException
	{

	}

	public void putCraftsMan(String name, CraftsMan man)
	{
		this.men.put(name, man);
	}

	public void getCraftsMan(String name, CraftsMan man)
	{
		this.men.get(name);
	}

	// GETTER/SETTER methods =====================
	public Map<String, Object> getReferences()
	{
		return references;
	}
}
