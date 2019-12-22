(ns guru.z3.temple.knot.cljimpl
  (:gen-class)
  (:import (com.miip.tool.core.box.clojure ClojureConfContext)))

(defn logFn
  ([msg] (. ClojureConfContext logFn msg nil))
  ([msg & args] (. ClojureConfContext logFn msg (to-array args))))

;;
(defstruct loom :knot :unknit :open :close)
;; TODO alias svids

;; add a definition of event and handler.
;; TODO simplify
(defn knot [buf]
   (fn [ceid, condFunc] (. ClojureConfContext addEvent ctx ceid condFunc)))


;; load configuration file
(defn loadEvent [ctx, path]
  (def define-event  (ctx-define-event ctx))
  (load-file path))
