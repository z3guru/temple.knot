package guru.z3.temple.knot;

import java.io.IOException;
import java.util.Set;

/**
 * untie
 */
public interface CraftsMan
{
	public enum WorkOption { RESET }

	public void knit(Fabric yarn, Set<WorkOption> options) throws IOException;

	public void unknit(Yarn yarn, Set<WorkOption> options) throws IOException;
}
