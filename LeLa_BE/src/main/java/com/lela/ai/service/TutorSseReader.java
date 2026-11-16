package com.lela.ai.service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;

/** UTF-8 decoding precedes line framing. Never trim SSE data or generated text. */
final class TutorSseReader {
    static void read(InputStream input, Consumer<String> event) throws IOException {
        var reader=new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(java.nio.charset.CodingErrorAction.REPORT)
                .onUnmappableCharacter(java.nio.charset.CodingErrorAction.REPORT)));
        var data=new StringBuilder(); boolean hasData=false;
        String line;
        while ((line=reader.readLine())!=null) {
            if (line.isEmpty()) {
                if (hasData) event.accept(data.toString());
                data.setLength(0);hasData=false;
            } else if (line.startsWith("data:")) {
                if (hasData) data.append('\n');
                String value=line.substring(5);
                data.append(value.startsWith(" ")?value.substring(1):value);hasData=true;
            }
        }
        if (hasData) event.accept(data.toString());
    }
}
