package guru.z3.temple.knot;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.RejectedExecutionException;
import java.util.function.Consumer;

/**
 * This class is a factory of {@link Craftsman}
 */
public class Workshop
{
	private Logger logger = LoggerFactory.getLogger(Workshop.class);

	/** Thread pool */
	private ExecutorService executorService;
	/** Thread pool */
	private Timer timer;

	/** */
	private ValueMap valueMap;
	/** */
	private ToolFinder toolFinder;
	/** must be set, TODO Redesign */
	private CraftsmanFinder craftsmanFinder;

	/** Crafts callbacks */
	private List<Consumer<Crafts>> craftsConsumers;
	/** CraftsEvent callbacks */
	private List<Consumer<CraftsEvent>> eventConsumers;

	public Workshop()
	{
		this.craftsConsumers = new LinkedList<>();
		this.eventConsumers = new LinkedList<>();
	}

	public void execute(Runnable r) throws RejectedExecutionException, NullPointerException
	{
		this.executorService.execute(r);
	}

	public TimerTask schedule(Runnable r, long interval, int iterateCount) throws RejectedExecutionException, NullPointerException
	{
		TimerTask task = new WorkshopTimerTask(r, iterateCount);
		this.timer.scheduleAtFixedRate(task, 1000L, interval);

		return task;
	}

	/**
	 * Request a service as a crafts to send data or receive data.
	 *
	 * @param crafts
	 * @throws IOException
	 */
	public void order(Crafts crafts) throws IOException
	{
		order(crafts, this.toolFinder == null ? null : this.toolFinder.find(crafts));
	}

	/**
	 * Request a service as a crafts to send data or receive data.
	 *
	 * @param crafts
	 * @throws IOException
	 */
	public void order(Crafts crafts, Tool tool) throws IOException
	{
		order(crafts, tool, 0, 1);
	}

	/**
	 * Request a service as a crafts to send data or receive data.
	 *
	 * @param crafts
	 * @throws IOException
	 */
	public void order(Crafts crafts, Tool tool, long interval, int iterateCount) throws IOException
	{
		if ( this.craftsmanFinder == null ) throw new IOException("There is no CraftsmanFinder in workshop");

		Craftsman cman = this.craftsmanFinder.find(crafts);
		cman.work(crafts, tool, interval, iterateCount);
	}

	public void onCrafted(Crafts crafts)
	{
		this.craftsConsumers.forEach(c -> c.accept(crafts));
	}

	public void onCraftsEvent(CraftsEvent event)
	{
		this.eventConsumers.forEach(c -> c.accept(event));
	}

	public void shutdown()
	{
		logger.warn("[Workshop] Shutdown is called !!!");
		// shutdown a pool of threads.
		if ( this.executorService != null ) this.executorService.shutdown();
	}

	public void addCraftsConsumer(Consumer<Crafts> consumer)
	{
		this.craftsConsumers.add(consumer);
	}

	public void addCraftsEventConsumer(Consumer<CraftsEvent> consumer)
	{
		this.eventConsumers.add(consumer);
	}


	// GETTER/SETTER methods =====================
	public ValueMap getValueMap() { return valueMap; }
	public void setValueMap(ValueMap valueMap) { this.valueMap = valueMap; }

	public ExecutorService getExecutorService() { return executorService; }
	public void setExecutorService(ExecutorService executorService) { this.executorService = executorService; }

	public Timer getTimer() { return timer; }
	public void setTimer(Timer timer) { this.timer = timer; }

	public ToolFinder getToolFinder() { return toolFinder; }
	public void setToolFinder(ToolFinder toolFinder) { this.toolFinder = toolFinder; }

	public CraftsmanFinder getCraftsmanFinder() { return craftsmanFinder; }
	public void setCraftsmanFinder(CraftsmanFinder craftsmanFinder) { this.craftsmanFinder = craftsmanFinder; }



	// TimerTask class ======
	private class WorkshopTimerTask extends TimerTask
	{
		private Runnable r;
		private int count;
		private int iterateCount;

		public WorkshopTimerTask(Runnable r, int iterateCount)
		{
			this.r = r;
			this.iterateCount = iterateCount;
		}

		@Override
		public void run()
		{
			try
			{
				r.run();
				if ( this.iterateCount > 0 && ++this.count >= this.iterateCount) cancel();
			}
			catch(Exception e)
			{
				logger.error(e.getMessage(), e);
			}
		}
	}
}
