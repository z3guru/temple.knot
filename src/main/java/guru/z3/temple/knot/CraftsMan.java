package guru.z3.temple.knot;

import java.io.IOException;
import java.util.Set;

/**
 * untie
 */
public interface CraftsMan
{
	public enum WorkOption { RESET }

	public void craft(Yarn yarn, Set<WorkOption> options) throws IOException;
}
